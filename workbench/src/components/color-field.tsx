import { Icon } from "@registry-ui/icon";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/utils/cn";
import { COLOR_KEYWORDS, swatchVar } from "~/utils/tw-tokens";

// Tokens grouped into named sections for the picker menu (swatch beside name, not a grid).
const TOKEN_SECTIONS: { header: string; tokens: string[] }[] = [
	{ header: "Brand", tokens: ["primary", "secondary", "destructive", "accent", "muted"] },
	{
		header: "Surfaces",
		tokens: [
			"background",
			"foreground",
			"card",
			"popover",
			"surface",
			"base",
			"crust",
			"mantle",
			"interactive",
		],
	},
	{ header: "Text", tokens: ["text", "subtext", "subtext0"] },
	{
		header: "Accents",
		tokens: [
			"pink",
			"cyan",
			"yellow",
			"purple",
			"blue",
			"green",
			"red",
			"orange",
			"bright-pink",
			"bright-cyan",
		],
	},
	{ header: "Status", tokens: ["success", "warn", "error", "info"] },
	{
		header: "Greyscale",
		tokens: [
			"grey-50",
			"grey-100",
			"grey-200",
			"grey-300",
			"grey-400",
			"grey-500",
			"grey-600",
			"grey-700",
			"grey-800",
			"grey-900",
			"grey-1000",
			"grey-1100",
			"grey-1200",
			"grey-1300",
		],
	},
];

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
					{TOKEN_SECTIONS.map((section) => (
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
