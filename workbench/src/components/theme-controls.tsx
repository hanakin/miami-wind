import { Icon } from "@registry-ui/icon";
import { useMemo, useState } from "react";
import { ColorControl } from "~/components/color-field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { useTheme } from "~/stores/theme";
import type { ThemeToken } from "../../server/lib/theme-codec";

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

export function ThemeControls() {
	const tokens = useTheme((s) => s.tokens);
	const groups = useMemo(() => {
		const map = new Map<string, ThemeToken[]>();
		for (const t of tokens) {
			const list = map.get(groupOf(t)) ?? [];
			list.push(t);
			map.set(groupOf(t), list);
		}
		return GROUP_ORDER.filter((g) => map.has(g)).map((title) => ({
			title,
			tokens: map.get(title) ?? [],
		}));
	}, [tokens]);

	return (
		<div className="flex flex-col gap-4 p-4">
			<CreateToken />
			{groups.map((g) => (
				<details key={g.title} open>
					<summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-subtext0">
						{g.title}
					</summary>
					<div className="mt-2 flex flex-col gap-2">
						{g.tokens.map((t) => (
							<TokenRow key={t.name} token={t} />
						))}
					</div>
				</details>
			))}
		</div>
	);
}

function TokenRow({ token }: { token: ThemeToken }) {
	const setValue = useTheme((s) => s.setValue);
	const removeToken = useTheme((s) => s.removeToken);
	return (
		<div className="flex items-center gap-2">
			<code className="w-32 shrink-0 truncate text-xs text-subtext0" title={token.name}>
				{token.name.replace(/^--(color-)?/, "")}
			</code>
			<div className="min-w-0 flex-1">
				<ColorControl
					swatch={`var(${token.name})`}
					display={token.value}
					hex={token.value.startsWith("#") ? token.value : "#000000"}
					onHex={(h) => setValue(token.name, h)}
					onToken={(t) => t && setValue(token.name, `var(--color-${t})`)}
					onValueEdit={(v) => setValue(token.name, v)}
				/>
			</div>
			<button
				type="button"
				aria-label={`remove ${token.name}`}
				onClick={() => removeToken(token.name)}
				className="grid size-6 shrink-0 cursor-pointer place-items-center rounded text-subtext0 transition-colors hover:text-error"
			>
				<Icon icon="mdi:close" size={14} />
			</button>
		</div>
	);
}

function CreateToken() {
	const addToken = useTheme((s) => s.addToken);
	const [base, setBase] = useState("");
	const [value, setValue] = useState("#f472b6");
	const [withUtilities, setWithUtilities] = useState("yes");
	const clean = base
		.replace(/^-+/, "")
		.replace(/[^a-z0-9-]+/gi, "-")
		.toLowerCase();

	const add = () => {
		if (!clean) return;
		addToken(
			withUtilities === "yes"
				? { name: `--color-${clean}`, value, layer: "theme" }
				: { name: `--${clean}`, value, layer: "dark" },
		);
		setBase("");
	};

	return (
		<details className="rounded-lg border border-border p-3">
			<summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-subtext0">
				Create token
			</summary>
			<div className="mt-3 flex flex-col gap-2">
				<input
					value={base}
					onChange={(e) => setBase(e.target.value)}
					placeholder="name (e.g. brand)"
					className="rounded-md border border-border bg-input px-2 py-1.5 font-mono text-xs text-text outline-none focus-visible:border-primary"
				/>
				<input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder="value"
					className="rounded-md border border-border bg-input px-2 py-1.5 font-mono text-xs text-text outline-none focus-visible:border-primary"
				/>
				<Select value={withUtilities} onValueChange={setWithUtilities}>
					<SelectTrigger className="h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="yes">var + utilities</SelectItem>
						<SelectItem value="no">var only</SelectItem>
					</SelectContent>
				</Select>
				<button
					type="button"
					onClick={add}
					disabled={!clean}
					className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-bright-pink disabled:cursor-not-allowed disabled:opacity-50"
				>
					Add token
				</button>
				<p className="text-[11px] text-subtext0">
					{withUtilities === "yes"
						? `--color-${clean || "name"} → generates bg-${clean || "name"}, text-${clean || "name"}…`
						: `--${clean || "name"} → plain CSS variable, no utility.`}
				</p>
			</div>
		</details>
	);
}
