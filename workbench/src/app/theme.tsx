import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { previews } from "~/components/previews";
import { useSaveTheme, useThemeData } from "~/hooks/use-theme-data";
import { themeDirty, themeStore, useTheme } from "~/stores/theme";
import { cn } from "~/utils/cn";
import type { ThemeToken } from "../../server/lib/theme-codec";

export const Route = createFileRoute("/theme")({
	component: ThemePage,
});

const PRIMARY_BTN =
	"cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-bright-pink disabled:cursor-not-allowed disabled:opacity-50";
const GHOST_BTN =
	"cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm text-subtext transition-colors hover:bg-interactive hover:text-text disabled:cursor-not-allowed disabled:opacity-50";

const CANVAS = [
	"button",
	"badge",
	"alert",
	"card",
	"input",
	"checkbox",
	"switch",
	"select",
	"tabs",
	"slider",
];

const GROUP_ORDER = [
	"Greyscale",
	"Grey semantics",
	"Colors",
	"Status & interactive",
	"Brand",
	"shadcn fallbacks",
];

function groupOf(t: ThemeToken): string {
	if (t.layer === "dark") return "shadcn fallbacks";
	const n = t.name.replace("--color-", "");
	if (/^grey-/.test(n)) return "Greyscale";
	if (["crust", "mantle", "base", "surface", "text", "subtext", "subtext0"].includes(n))
		return "Grey semantics";
	if (/^(success|warn|error|info|interactive)/.test(n)) return "Status & interactive";
	if (/^(primary|secondary)/.test(n) || n.endsWith("-transparent")) return "Brand";
	return "Colors";
}

function groupTokens(tokens: ThemeToken[]): { title: string; tokens: ThemeToken[] }[] {
	const map = new Map<string, ThemeToken[]>();
	for (const t of tokens) {
		const g = groupOf(t);
		const list = map.get(g) ?? [];
		list.push(t);
		map.set(g, list);
	}
	return GROUP_ORDER.filter((g) => map.has(g)).map((title) => ({
		title,
		tokens: map.get(title) ?? [],
	}));
}

function ThemePage() {
	const query = useThemeData();
	const tokens = useTheme((s) => s.tokens);
	const dirty = useTheme(themeDirty);
	const save = useSaveTheme();
	const groups = useMemo(() => groupTokens(tokens), [tokens]);

	if (query.isLoading && tokens.length === 0) {
		return <div className="p-6 text-sm text-subtext0">Loading theme…</div>;
	}

	return (
		<div className="flex h-full flex-col">
			<header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
				<div className="flex items-center gap-2">
					<h1 className="text-lg font-semibold tracking-tight">Theme</h1>
					{dirty && (
						<span className="rounded bg-interactive px-1.5 py-0.5 text-[10px] font-medium text-subtext0">
							unsaved
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						disabled={!dirty}
						onClick={() => themeStore.getState().revert()}
						className={GHOST_BTN}
					>
						Revert
					</button>
					<button
						type="button"
						disabled={!dirty || save.isPending}
						onClick={() => save.mutate({ tokens })}
						className={PRIMARY_BTN}
					>
						{save.isPending ? "Saving…" : "Save theme"}
					</button>
				</div>
			</header>

			<div className="grid min-h-0 flex-1 grid-cols-[1fr_minmax(0,440px)]">
				<div className="overflow-auto p-6">
					<CreateToken />
					{groups.map((g) => (
						<TokenGroup key={g.title} title={g.title} tokens={g.tokens} />
					))}
				</div>
				<aside className="overflow-auto border-l border-border bg-mantle p-6">
					<h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-subtext0">
						Live preview
					</h2>
					<div className="flex flex-col gap-5">
						{CANVAS.map((name) => (
							<div key={name}>{previews[name]?.()}</div>
						))}
					</div>
				</aside>
			</div>
		</div>
	);
}

function TokenGroup({ title, tokens }: { title: string; tokens: ThemeToken[] }) {
	return (
		<section className="mb-6">
			<h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-subtext0">{title}</h2>
			<div className="flex flex-col divide-y divide-border rounded-lg border border-border">
				{tokens.map((t) => (
					<TokenRow key={t.name} token={t} />
				))}
			</div>
		</section>
	);
}

function TokenRow({ token }: { token: ThemeToken }) {
	const setValue = useTheme((s) => s.setValue);
	const removeToken = useTheme((s) => s.removeToken);
	const isHex = /^#([0-9a-f]{3,8})$/i.test(token.value);

	return (
		<div className="flex items-center gap-2 px-3 py-1.5">
			<span
				className="size-6 shrink-0 rounded border border-border"
				style={{ backgroundColor: `var(${token.name})` }}
			/>
			<code className="w-48 shrink-0 truncate text-xs text-subtext0" title={token.name}>
				{token.name.replace(/^--(color-)?/, "")}
			</code>
			{isHex && (
				<input
					type="color"
					value={token.value}
					onChange={(e) => setValue(token.name, e.target.value)}
					className="size-7 shrink-0 cursor-pointer rounded border border-border bg-transparent"
					aria-label={`${token.name} color`}
				/>
			)}
			<input
				value={token.value}
				onChange={(e) => setValue(token.name, e.target.value)}
				spellCheck={false}
				className="min-w-0 flex-1 rounded-md border border-border bg-input px-2 py-1 font-mono text-xs text-text outline-none focus-visible:border-primary"
			/>
			<button
				type="button"
				onClick={() => removeToken(token.name)}
				className="shrink-0 cursor-pointer rounded px-1.5 text-xs text-subtext0 transition-colors hover:text-error"
				aria-label={`remove ${token.name}`}
			>
				✕
			</button>
		</div>
	);
}

function CreateToken() {
	const addToken = useTheme((s) => s.addToken);
	const [base, setBase] = useState("");
	const [value, setValue] = useState("#f472b6");
	const [withUtilities, setWithUtilities] = useState(true);
	const clean = base
		.replace(/^-+/, "")
		.replace(/[^a-z0-9-]+/gi, "-")
		.toLowerCase();

	const add = () => {
		if (!clean) return;
		addToken(
			withUtilities
				? { name: `--color-${clean}`, value, layer: "theme" }
				: { name: `--${clean}`, value, layer: "dark" },
		);
		setBase("");
	};

	return (
		<div className="mb-6 rounded-lg border border-border bg-card p-4">
			<h2 className="text-xs font-medium uppercase tracking-wide text-subtext0">Create token</h2>
			<div className="mt-2 flex flex-wrap items-center gap-2">
				<input
					value={base}
					onChange={(e) => setBase(e.target.value)}
					placeholder="name (e.g. brand)"
					className="w-40 rounded-md border border-border bg-input px-2 py-1.5 font-mono text-xs text-text outline-none focus-visible:border-primary"
				/>
				<input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder="value"
					className="w-40 rounded-md border border-border bg-input px-2 py-1.5 font-mono text-xs text-text outline-none focus-visible:border-primary"
				/>
				<div className="flex overflow-hidden rounded-md border border-border">
					<FormatBtn active={withUtilities} onClick={() => setWithUtilities(true)}>
						var + utilities
					</FormatBtn>
					<FormatBtn active={!withUtilities} onClick={() => setWithUtilities(false)}>
						var only
					</FormatBtn>
				</div>
				<button type="button" onClick={add} disabled={!clean} className={PRIMARY_BTN}>
					Add
				</button>
			</div>
			<p className="mt-2 text-xs text-subtext0">
				{withUtilities
					? `--color-${clean || "name"} → generates bg-${clean || "name"}, text-${clean || "name"}, border-${clean || "name"}…`
					: `--${clean || "name"} → a plain CSS variable, no utility class.`}
			</p>
		</div>
	);
}

function FormatBtn({
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
				"cursor-pointer px-2.5 py-1.5 text-xs transition-colors",
				active ? "bg-primary text-primary-foreground" : "bg-input text-subtext hover:text-text",
			)}
		>
			{children}
		</button>
	);
}
