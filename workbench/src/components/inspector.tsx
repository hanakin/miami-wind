import { Icon } from "@registry-ui/icon";
import { useMemo, useState } from "react";
import { useTailwindClasses } from "~/hooks/use-workbench-data";
import { cn } from "~/utils/cn";
import {
	addRaw,
	applyUtility,
	COLOR_TOKENS,
	type ColorProp,
	colorUtility,
	findUtility,
	isColor,
	parseClasses,
	parseColor,
	removeRaw,
	STATES,
	swatchVar,
	type Token,
} from "~/utils/tw-tokens";

interface SelectDef {
	id: string;
	label: string;
	match: (u: string) => boolean;
	options: [label: string, utility: string][];
}

const SELECTS: SelectDef[] = [
	{
		id: "radius",
		label: "Radius",
		match: (u) => u === "rounded" || /^rounded-(none|xs|sm|md|lg|xl|2xl|3xl|full)$/.test(u),
		options: [
			["none", "rounded-none"],
			["sm", "rounded-sm"],
			["md", "rounded-md"],
			["lg", "rounded-lg"],
			["xl", "rounded-xl"],
			["full", "rounded-full"],
		],
	},
	{
		id: "border-w",
		label: "Border width",
		match: (u) => u === "border" || /^border-\d+$/.test(u),
		options: [
			["0", "border-0"],
			["1", "border"],
			["2", "border-2"],
			["4", "border-4"],
		],
	},
	{
		id: "font-weight",
		label: "Font weight",
		match: (u) =>
			/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(u),
		options: [
			["normal", "font-normal"],
			["medium", "font-medium"],
			["semibold", "font-semibold"],
			["bold", "font-bold"],
		],
	},
	{
		id: "font-size",
		label: "Font size",
		match: (u) => /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/.test(u),
		options: [
			["xs", "text-xs"],
			["sm", "text-sm"],
			["base", "text-base"],
			["lg", "text-lg"],
			["xl", "text-xl"],
			["2xl", "text-2xl"],
		],
	},
	{
		id: "cursor",
		label: "Cursor",
		match: (u) => /^cursor-/.test(u),
		options: [
			["pointer", "cursor-pointer"],
			["default", "cursor-default"],
			["not-allowed", "cursor-not-allowed"],
			["wait", "cursor-wait"],
		],
	},
];

interface CtlProps {
	value: string;
	state: string;
	onChange: (v: string) => void;
}

export function Inspector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	const [state, setState] = useState("");
	const stateTokens = parseClasses(value).filter((t) => t.state === state);
	const ctl = { value, state, onChange };

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap gap-1">
				{STATES.map((s) => (
					<button
						key={s.key || "base"}
						type="button"
						onClick={() => setState(s.key)}
						className={cn(
							"cursor-pointer rounded px-2 py-1 text-xs transition-colors",
							state === s.key
								? "bg-primary text-primary-foreground"
								: "bg-interactive text-subtext hover:text-text",
						)}
					>
						{s.label}
					</button>
				))}
			</div>

			<ColorControl label="Background" prop="bg" {...ctl} />
			<ColorControl label="Text" prop="text" {...ctl} />
			<ColorControl label="Border" prop="border" {...ctl} />

			<div className="flex flex-col gap-3">
				{SELECTS.map((def) => (
					<SelectControl key={def.id} def={def} {...ctl} />
				))}
				<OpacityControl {...ctl} />
			</div>

			<div>
				<Label>Classes · {state || "base"}</Label>
				<Chips tokens={stateTokens} value={value} onChange={onChange} />
			</div>

			<AddClass {...ctl} />
		</div>
	);
}

function ColorControl({
	label,
	prop,
	value,
	state,
	onChange,
}: CtlProps & { label: string; prop: ColorProp }) {
	const current = findUtility(value, state, isColor(prop));
	const parsed = current ? parseColor(current, prop) : null;
	const token = parsed?.token ?? null;
	const opacity = parsed?.opacity ?? 100;

	const setColor = (next: string | null) =>
		onChange(
			applyUtility(value, state, isColor(prop), next ? colorUtility(prop, next, opacity) : null),
		);
	const setOpacity = (op: number) =>
		token && onChange(applyUtility(value, state, isColor(prop), colorUtility(prop, token, op)));

	return (
		<div>
			<div className="flex items-center justify-between">
				<Label>{label}</Label>
				{token && <Clear onClick={() => setColor(null)} />}
			</div>
			<div className="mt-1.5 flex flex-wrap gap-1">
				{COLOR_TOKENS.map((t) => (
					<button
						key={t}
						type="button"
						title={t}
						onClick={() => setColor(t)}
						style={{ backgroundColor: swatchVar(t) }}
						className={cn(
							"relative size-5 cursor-pointer rounded border",
							token === t ? "border-text" : "border-border",
						)}
					>
						{token === t && (
							<Icon
								icon="mdi:check"
								size={12}
								className="absolute inset-0 m-auto text-text mix-blend-difference"
							/>
						)}
					</button>
				))}
			</div>
			{token && (
				<div className="mt-2 flex items-center gap-2">
					<span className="w-12 text-[10px] text-subtext0">opacity</span>
					<input
						type="range"
						min={0}
						max={100}
						step={5}
						value={opacity}
						onChange={(e) => setOpacity(Number(e.target.value))}
						className="flex-1 cursor-pointer accent-primary"
					/>
					<span className="w-8 text-right text-[10px] text-subtext0 tabular-nums">{opacity}%</span>
				</div>
			)}
		</div>
	);
}

function SelectControl({ def, value, state, onChange }: CtlProps & { def: SelectDef }) {
	const current = findUtility(value, state, def.match);
	return (
		<div>
			<Label>{def.label}</Label>
			<div className="mt-1 flex flex-wrap gap-1">
				<Opt
					active={!current}
					onClick={() => onChange(applyUtility(value, state, def.match, null))}
				>
					—
				</Opt>
				{def.options.map(([opt, util]) => (
					<Opt
						key={util}
						active={current === util}
						onClick={() => onChange(applyUtility(value, state, def.match, util))}
					>
						{opt}
					</Opt>
				))}
			</div>
		</div>
	);
}

function OpacityControl({ value, state, onChange }: CtlProps) {
	const match = (u: string) => /^opacity-\d+$/.test(u);
	const current = findUtility(value, state, match);
	const op = current ? Number(current.slice("opacity-".length)) : null;
	return (
		<div>
			<div className="flex items-center justify-between">
				<Label>Opacity</Label>
				{op !== null && <Clear onClick={() => onChange(applyUtility(value, state, match, null))} />}
			</div>
			<div className="mt-1 flex items-center gap-2">
				<input
					type="range"
					min={0}
					max={100}
					step={5}
					value={op ?? 100}
					onChange={(e) => onChange(applyUtility(value, state, match, `opacity-${e.target.value}`))}
					className="flex-1 cursor-pointer accent-primary"
				/>
				<span className="w-8 text-right text-[10px] text-subtext0 tabular-nums">{op ?? 100}%</span>
			</div>
		</div>
	);
}

function Chips({
	tokens,
	value,
	onChange,
}: {
	tokens: Token[];
	value: string;
	onChange: (v: string) => void;
}) {
	if (tokens.length === 0)
		return <p className="mt-1 text-xs text-subtext0">No classes in this state.</p>;
	return (
		<div className="mt-1.5 flex flex-wrap gap-1">
			{tokens.map((t) => (
				<span
					key={t.raw}
					className="inline-flex items-center gap-1 rounded bg-interactive py-0.5 pr-1 pl-1.5 font-mono text-[11px] text-text"
				>
					{t.utility}
					<button
						type="button"
						onClick={() => onChange(removeRaw(value, t.raw))}
						aria-label={`remove ${t.utility}`}
						className="cursor-pointer rounded text-subtext0 hover:text-text"
					>
						<Icon icon="mdi:close" size={12} />
					</button>
				</span>
			))}
		</div>
	);
}

function AddClass({ value, state, onChange }: CtlProps) {
	const [q, setQ] = useState("");
	const classes = useTailwindClasses();
	const list = classes.data?.classes ?? [];

	const matches = useMemo(() => {
		const ql = q.trim().toLowerCase().replace(/^.*:/, "");
		if (!ql) return [];
		const starts: string[] = [];
		const includes: string[] = [];
		for (const c of list) {
			if (c.startsWith(ql)) starts.push(c);
			else if (c.includes(ql)) includes.push(c);
			if (starts.length >= 50) break;
		}
		return [...starts, ...includes].slice(0, 50);
	}, [q, list]);

	const addSuggestion = (util: string) => {
		onChange(addRaw(value, state + util));
		setQ("");
	};

	return (
		<div>
			<Label>Add class</Label>
			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && q.trim()) {
						onChange(addRaw(value, q.trim()));
						setQ("");
					}
				}}
				placeholder={
					classes.isLoading ? "loading classes…" : "e.g. shadow-sm, gap-2, [mask-type:luminance]"
				}
				spellCheck={false}
				className="mt-1 w-full rounded-md border border-border bg-input px-2 py-1.5 font-mono text-xs text-text outline-none focus-visible:border-primary"
			/>
			{matches.length > 0 && (
				<div className="mt-1 max-h-44 overflow-auto rounded-md border border-border bg-popover">
					{matches.map((c) => (
						<button
							key={c}
							type="button"
							onClick={() => addSuggestion(c)}
							className="block w-full cursor-pointer px-2 py-1 text-left font-mono text-xs text-subtext transition-colors hover:bg-interactive hover:text-text"
						>
							{state}
							{c}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return <span className="text-xs font-medium text-subtext0">{children}</span>;
}

function Clear({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="cursor-pointer text-[10px] text-subtext0 transition-colors hover:text-text"
		>
			clear
		</button>
	);
}

function Opt({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"cursor-pointer rounded px-2 py-1 text-xs transition-colors",
				active
					? "bg-primary text-primary-foreground"
					: "bg-interactive text-subtext hover:text-text",
			)}
		>
			{children}
		</button>
	);
}
