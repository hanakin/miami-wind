import { Icon } from "@registry-ui/icon";
import { useMemo } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useTheme } from "~/stores/theme";
import { cn } from "~/utils/cn";
import { COLOR_KEYWORDS, isColorValue, swatchVar, tokenUtil } from "~/utils/tw-tokens";

// Menu sections in display order. Every color var in the live theme is placed into the first section
// whose test matches; unmatched vars fall through to "Other", so the menu can never omit a token.
const SECTIONS: { header: string; test: (n: string) => boolean }[] = [
	{
		header: "Brand",
		test: (n) =>
			(/^(primary|secondary)/.test(n) && !n.endsWith("-foreground")) ||
			n.endsWith("-transparent") ||
			["accent", "destructive", "muted"].includes(n),
	},
	{
		header: "Surfaces",
		test: (n) =>
			/^sidebar/.test(n) ||
			[
				"background",
				"foreground",
				"card",
				"popover",
				"surface",
				"base",
				"crust",
				"mantle",
				"interactive",
			].includes(n),
	},
	{
		header: "Text",
		test: (n) => n.endsWith("-foreground") || ["text", "subtext", "subtext0"].includes(n),
	},
	{
		header: "Accents",
		test: (n) =>
			/^bright-/.test(n) ||
			["pink", "cyan", "yellow", "purple", "blue", "green", "red", "orange"].includes(n),
	},
	{ header: "Status", test: (n) => ["success", "warn", "error", "info"].includes(n) },
	{ header: "Greyscale", test: (n) => /^grey-/.test(n) },
	{ header: "Other", test: () => true },
];

// Derive the picker menu from the live theme: color vars only, deduped by utility name, first section
// that matches. Reacts to every theme edit (add/remove token), so it always mirrors the CSS vars.
function useColorSections() {
	const tokens = useTheme((s) => s.tokens);
	return useMemo(() => {
		const seen = new Set<string>();
		const buckets = new Map<string, string[]>();
		for (const t of tokens) {
			if (!isColorValue(t.value)) continue;
			const n = tokenUtil(t.name);
			if (seen.has(n)) continue;
			seen.add(n);
			const header = SECTIONS.find((s) => s.test(n))?.header ?? "Other";
			const bucket = buckets.get(header) ?? [];
			bucket.push(n);
			buckets.set(header, bucket);
		}
		return SECTIONS.filter((s) => buckets.has(s.header)).map((s) => ({
			header: s.header,
			tokens: buckets.get(s.header) ?? [],
		}));
	}, [tokens]);
}

const ICON_BTN =
	"grid size-7 shrink-0 cursor-pointer place-items-center rounded-md border border-border text-subtext0 transition-colors hover:border-primary hover:text-text";

interface ColorControlProps {
	swatch: string; // resolved CSS color for the current value
	display: string; // token name / hex / "none" / raw value
	hex: string; // current hex for the picker (fallback when value is a reference)
	onHex: (hex: string) => void;
	onToken: (token: string | null) => void;
	allowNone?: boolean;
	onValueEdit?: (value: string) => void; // when set, the display becomes an editable field
}

// A color picker icon (arbitrary hex) + a menu icon (named tokens, sectioned). No swatch walls.
// Opacity lives in the editing pane next to the swatch, not in this menu.
export function ColorControl({
	swatch,
	display,
	hex,
	onHex,
	onToken,
	allowNone = false,
	onValueEdit,
}: ColorControlProps) {
	const sections = useColorSections();
	return (
		<div className="flex items-center gap-1.5">
			<span
				className="size-5 shrink-0 rounded border border-border"
				style={{ backgroundColor: swatch }}
			/>
			{onValueEdit ? (
				<input
					value={display}
					onChange={(e) => onValueEdit(e.target.value)}
					spellCheck={false}
					className="min-w-0 flex-1 rounded-md border border-border bg-input px-2 py-1 font-mono text-xs text-text outline-none focus-visible:border-primary"
				/>
			) : (
				<span className="min-w-0 flex-1 truncate font-mono text-xs text-subtext">{display}</span>
			)}

			<Popover>
				<PopoverTrigger asChild>
					<button type="button" aria-label="Color picker" className={ICON_BTN}>
						<Icon icon="mdi:eyedropper-variant" size={14} />
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-3" align="end">
					<HexColorPicker color={hex} onChange={onHex} />
				</PopoverContent>
			</Popover>

			<Popover>
				<PopoverTrigger asChild>
					<button type="button" aria-label="Token menu" className={ICON_BTN}>
						<Icon icon="mdi:palette-swatch" size={14} />
					</button>
				</PopoverTrigger>
				<PopoverContent className="max-h-80 w-56 overflow-x-hidden overflow-y-auto p-1" align="end">
					{allowNone && (
						<MenuRow
							active={display === "none"}
							swatch="transparent"
							name="none (clear override)"
							onClick={() => onToken(null)}
						/>
					)}
					{allowNone &&
						COLOR_KEYWORDS.map((k) => (
							<MenuRow
								key={k}
								active={display === k}
								swatch={swatchVar(k)}
								name={k}
								onClick={() => onToken(k)}
							/>
						))}
					{sections.map((section) => (
						<div key={section.header}>
							<div className="px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-subtext0">
								{section.header}
							</div>
							{section.tokens.map((t) => (
								<MenuRow
									key={t}
									active={display === t}
									swatch={swatchVar(t)}
									name={t}
									onClick={() => onToken(t)}
								/>
							))}
						</div>
					))}
				</PopoverContent>
			</Popover>
		</div>
	);
}

function MenuRow({
	active,
	swatch,
	name,
	onClick,
}: {
	active: boolean;
	swatch: string;
	name: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors hover:bg-interactive hover:text-text",
				active ? "bg-interactive text-text" : "text-subtext",
			)}
		>
			<span
				className="size-4 shrink-0 rounded-sm border border-border"
				style={{ backgroundColor: swatch }}
			/>
			<span className="min-w-0 flex-1 truncate font-mono">{name}</span>
		</button>
	);
}
