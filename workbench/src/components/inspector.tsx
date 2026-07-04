import { Icon } from "@registry-ui/icon";
import { type ReactNode, useMemo, useState } from "react";
import { ColorControl } from "~/components/color-field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { useTailwindClasses } from "~/hooks/use-workbench-data";
import {
	addRaw,
	applyUtility,
	arbitraryColor,
	type ColorProp,
	colorMatch,
	colorUtility,
	findUtility,
	parseClasses,
	readEffectiveColor,
	removeRaw,
	sizeMatch,
	stateLabel,
	statesIn,
	swatchVar,
} from "~/utils/tw-tokens";

type Opt = [label: string, utility: string];
const RADIUS: Opt[] = [
	["None", "rounded-none"],
	["sm", "rounded-sm"],
	["md", "rounded-md"],
	["lg", "rounded-lg"],
	["xl", "rounded-xl"],
	["Full", "rounded-full"],
];
const BORDER_W: Opt[] = [
	["0", "border-0"],
	["1", "border"],
	["2", "border-2"],
	["4", "border-4"],
];
const FONT_SIZE: Opt[] = [
	["xs", "text-xs"],
	["sm", "text-sm"],
	["base", "text-base"],
	["lg", "text-lg"],
	["xl", "text-xl"],
	["2xl", "text-2xl"],
];
const FONT_WEIGHT: Opt[] = [
	["Normal", "font-normal"],
	["Medium", "font-medium"],
	["Semibold", "font-semibold"],
	["Bold", "font-bold"],
];
const CURSOR: Opt[] = [
	["Pointer", "cursor-pointer"],
	["Default", "cursor-default"],
	["Not allowed", "cursor-not-allowed"],
	["Wait", "cursor-wait"],
];
const SIZE: Opt[] = [
	["4", "size-4"],
	["5", "size-5"],
	["6", "size-6"],
	["8", "size-8"],
	["10", "size-10"],
	["Full", "size-full"],
];

const radiusMatch = (u: string) =>
	u === "rounded" || /^rounded-(none|xs|sm|md|lg|xl|2xl|3xl|full)$/.test(u);
const borderWMatch = (u: string) => u === "border" || /^border-\d+$/.test(u);
const fontSizeMatch = (u: string) => /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/.test(u);
const fontWeightMatch = (u: string) =>
	/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(u);
const cursorMatch = (u: string) => /^cursor-/.test(u);
const opacityMatch = (u: string) => /^opacity-\d+$/.test(u);

export function Inspector({
	value,
	inherited = "",
	onChange,
	context = "",
	state,
	onStateChange,
}: {
	value: string;
	/** Classes beneath the edited target (e.g. cva base when editing a variant) — for showing inherited colors. */
	inherited?: string;
	onChange: (v: string) => void;
	/** A pass-through selector prefix (e.g. `[a]:`) so every control edits that context's utilities. */
	context?: string;
	/** The selected interaction state (`hover:`, `data-[state=checked]:`, …). Lifted so the preview can force it. */
	state: string;
	onStateChange: (s: string) => void;
}) {
	// Everything the controls read/write is scoped to context + interaction state, e.g. `[a]:hover:`.
	const fullState = context + state;
	const set = (match: (u: string) => boolean, util: string | null) =>
		onChange(applyUtility(value, fullState, match, util));

	// States aren't a fixed list — derive them from the target's real classes so every component's own
	// states surface (checkbox → checked, tabs → active, accordion → open, …). Deduped by LABEL: common
	// pseudos come first, but a REAL state owns its label (tabs' `data-[state=active]` wins "Active" over
	// the `active:` pseudo), and two reals that read the same (label's group-data-[disabled] +
	// peer-disabled → "Disabled") collapse to one.
	const stateKeys = useMemo(() => {
		const reals = [...statesIn(value), ...statesIn(inherited)];
		const realLabels = new Set(reals.map(stateLabel));
		const byLabel = new Map<string, string>([["Base", ""]]);
		for (const k of ["hover:", "focus-visible:", "active:", "disabled:"]) {
			if (!realLabels.has(stateLabel(k))) byLabel.set(stateLabel(k), k);
		}
		for (const k of reals) if (!byLabel.has(stateLabel(k))) byLabel.set(stateLabel(k), k);
		return [...byLabel.values()];
	}, [value, inherited]);

	return (
		<div className="flex flex-col gap-4">
			<Field label="State">
				<Select
					value={state || "__base"}
					onValueChange={(v) => onStateChange(v === "__base" ? "" : v)}
				>
					<SelectTrigger className="h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{stateKeys.map((k) => (
							<SelectItem key={k || "__base"} value={k || "__base"}>
								{stateLabel(k)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>

			<ColorRow
				label="Background"
				prop="bg"
				value={value}
				inherited={inherited}
				state={fullState}
				onChange={onChange}
			/>
			<ColorRow
				label="Text"
				prop="text"
				value={value}
				inherited={inherited}
				state={fullState}
				onChange={onChange}
			/>
			<ColorRow
				label="Border"
				prop="border"
				value={value}
				inherited={inherited}
				state={fullState}
				onChange={onChange}
			/>

			<div className="grid grid-cols-2 gap-3">
				<SelectField
					label="Border width"
					value={findUtility(value, fullState, borderWMatch)}
					options={BORDER_W}
					onSelect={(u) => set(borderWMatch, u)}
				/>
				<SelectField
					label="Radius"
					value={findUtility(value, fullState, radiusMatch)}
					options={RADIUS}
					onSelect={(u) => set(radiusMatch, u)}
				/>
				<SelectField
					label="Size"
					value={findUtility(value, fullState, sizeMatch)}
					options={SIZE}
					onSelect={(u) => set(sizeMatch, u)}
				/>
			</div>

			<Disclosure label="Typography & effects">
				<div className="grid grid-cols-2 gap-3">
					<SelectField
						label="Font size"
						value={findUtility(value, fullState, fontSizeMatch)}
						options={FONT_SIZE}
						onSelect={(u) => set(fontSizeMatch, u)}
					/>
					<SelectField
						label="Font weight"
						value={findUtility(value, fullState, fontWeightMatch)}
						options={FONT_WEIGHT}
						onSelect={(u) => set(fontWeightMatch, u)}
					/>
				</div>
				<SelectField
					label="Cursor"
					value={findUtility(value, fullState, cursorMatch)}
					options={CURSOR}
					onSelect={(u) => set(cursorMatch, u)}
				/>
				<OpacityField value={value} state={fullState} onChange={onChange} />
			</Disclosure>

			<Disclosure label="Raw classes">
				<RawClasses value={value} state={fullState} onChange={onChange} />
			</Disclosure>
		</div>
	);
}

function ColorRow({
	label,
	prop,
	value,
	inherited,
	state,
	onChange,
}: {
	label: string;
	prop: ColorProp;
	value: string;
	inherited: string;
	state: string;
	onChange: (v: string) => void;
}) {
	const c = readEffectiveColor(value, inherited, state, prop);
	const token = c.token;
	const set = (util: string | null) => onChange(applyUtility(value, state, colorMatch(prop), util));
	const swatch = token ? swatchVar(token) : (c.arbitrary ?? "transparent");
	return (
		<Field label={label}>
			<ColorControl
				swatch={swatch}
				display={token ?? c.arbitrary ?? "none"}
				hex={c.arbitrary?.startsWith("#") ? c.arbitrary : "#000000"}
				onHex={(h) => set(arbitraryColor(prop, h))}
				onToken={(t) => set(t ? colorUtility(prop, t, c.opacity) : null)}
				allowNone
			/>
			{c.inherited && (token || c.arbitrary) && (
				<p className="text-[10px] text-subtext0">
					inherited — pick a color or transparent to override it here
				</p>
			)}
			{token && !c.inherited && (
				<div className="flex items-center gap-2">
					<span className="w-12 text-[10px] text-subtext0">opacity</span>
					<input
						type="range"
						min={0}
						max={100}
						step={5}
						value={c.opacity}
						onChange={(e) => set(colorUtility(prop, token, Number(e.target.value)))}
						aria-label={`${label} opacity`}
						className="flex-1 cursor-pointer accent-primary"
					/>
					<span className="w-8 text-right text-[10px] text-subtext0 tabular-nums">
						{c.opacity}%
					</span>
				</div>
			)}
		</Field>
	);
}

function SelectField({
	label,
	value,
	options,
	onSelect,
}: {
	label: string;
	value: string | null;
	options: Opt[];
	onSelect: (u: string | null) => void;
}) {
	return (
		<Field label={label}>
			<Select value={value ?? "__none"} onValueChange={(v) => onSelect(v === "__none" ? null : v)}>
				<SelectTrigger className="h-8">
					<SelectValue placeholder="—" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="__none">—</SelectItem>
					{options.map(([l, u]) => (
						<SelectItem key={u} value={u}>
							{l}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}

function OpacityField({
	value,
	state,
	onChange,
}: {
	value: string;
	state: string;
	onChange: (v: string) => void;
}) {
	const current = findUtility(value, state, opacityMatch);
	const op = current ? Number(current.slice("opacity-".length)) : 100;
	return (
		<Field label="Opacity">
			<div className="flex items-center gap-2">
				<input
					type="range"
					min={0}
					max={100}
					step={5}
					value={op}
					onChange={(e) =>
						onChange(applyUtility(value, state, opacityMatch, `opacity-${e.target.value}`))
					}
					className="flex-1 cursor-pointer accent-primary"
				/>
				<span className="w-8 text-right text-[10px] text-subtext0 tabular-nums">{op}%</span>
			</div>
		</Field>
	);
}

function RawClasses({
	value,
	state,
	onChange,
}: {
	value: string;
	state: string;
	onChange: (v: string) => void;
}) {
	const [q, setQ] = useState("");
	const classes = useTailwindClasses();
	// Every selector on this target — [&_svg]:, hover:, focus-visible:, aria-*, data-*, arbitrary [] —
	// not just the current State's, so nothing is hidden from editing (CLS/E2). New classes still add at
	// the selected state below.
	const tokens = parseClasses(value);
	const matches = useMemo(() => {
		const ql = q.trim().toLowerCase().replace(/^.*:/, "");
		if (!ql) return [];
		return (classes.data?.classes ?? []).filter((c) => c.includes(ql)).slice(0, 30);
	}, [q, classes.data]);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap gap-1">
				{tokens.length === 0 && (
					<span className="text-xs text-subtext0">No classes on this part.</span>
				)}
				{tokens.map((t) => (
					<span
						key={t.raw}
						className="inline-flex items-center gap-1 rounded bg-interactive py-0.5 pr-1 pl-1.5 font-mono text-[11px] text-text"
					>
						{t.raw}
						<button
							type="button"
							aria-label={`remove ${t.utility}`}
							onClick={() => onChange(removeRaw(value, t.raw))}
							className="cursor-pointer text-subtext0 hover:text-text"
						>
							<Icon icon="mdi:close" size={12} />
						</button>
					</span>
				))}
			</div>
			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && q.trim()) {
						onChange(addRaw(value, q.trim()));
						setQ("");
					}
				}}
				placeholder="add class…"
				spellCheck={false}
				className="w-full rounded-md border border-border bg-input px-2 py-1.5 font-mono text-xs text-text outline-none focus-visible:border-primary"
			/>
			{matches.length > 0 && (
				<div className="max-h-40 overflow-auto rounded-md border border-border bg-popover">
					{matches.map((c) => (
						<button
							key={c}
							type="button"
							onClick={() => {
								onChange(addRaw(value, state + c));
								setQ("");
							}}
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

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-xs font-medium text-subtext0">{label}</span>
			{children}
		</div>
	);
}

function Disclosure({ label, children }: { label: string; children: ReactNode }) {
	return (
		<details className="border-t border-border pt-3">
			<summary className="cursor-pointer text-xs font-medium text-subtext0 transition-colors hover:text-text">
				{label}
			</summary>
			<div className="mt-3 flex flex-col gap-3">{children}</div>
		</details>
	);
}
