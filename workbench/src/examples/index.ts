import type { ComponentType } from "react";
import { ItemDemo, ItemPrimary } from "./item/item-demo";
import { ItemGroupExample } from "./item/item-group";
import { ItemHeaderDemo } from "./item/item-header";
import { ItemLinkExample } from "./item/item-link";
import { ItemMediaIconExample, ItemMediaImageExample } from "./item/item-media";
import { SeparatorDemo } from "./separator/separator-demo";

export type ExampleEntry = { name: string; label: string; Component: ComponentType };

// Hand-authored, static. shadcn's real example content, consolidated to the fewest that still
// exercise every Item data-slot (see components/ui/item.tsx): item, item-group, item-separator,
// item-media, item-content, item-title, item-description, item-actions, item-header, item-footer.
export const examples: Record<string, ExampleEntry[]> = {
	item: [
		{ name: "item-demo", label: "Demo", Component: ItemDemo },
		{ name: "item-group", label: "Group", Component: ItemGroupExample },
		{ name: "item-header", label: "Header", Component: ItemHeaderDemo },
	],
	separator: [{ name: "separator-demo", label: "Demo", Component: SeparatorDemo }],
};

// The canonical single instance per component, re-rendered with the selected variant applied so
// filtering to a variant shows that variant — stock, one we modify, or a new one added in "Manage
// variants". A static example can't cover a variant that doesn't exist yet; this can.
export const primaryExamples: Record<string, ComponentType<Record<string, string>>> = {
	item: ItemPrimary,
};

// Per-variant example override, keyed by `symbol:axis:option` (symbol = the owning cva's export name,
// since a component can have several). Use when a variant doesn't read as a lone primary — item's root
// `default` is transparent (show it in a group), and the media cva's icon/image variants live on
// <ItemMedia>, not the root, so they need an example that puts the variant there. Rendered as-is; the
// example itself uses the variant. Unmapped variants fall back to the root primary (see example-preview).
export const variantExamples: Record<string, Record<string, ComponentType>> = {
	item: {
		"itemVariants:variant:default": ItemGroupExample,
		"itemMediaVariants:variant:icon": ItemMediaIconExample,
		"itemMediaVariants:variant:image": ItemMediaImageExample,
	},
};

// Per-component example for a pass-through context (keyed by the context, e.g. `a`). Rendered when
// that context target is selected, so the styling it carries is actually visible — e.g. the item as
// an <a> link, where its `[a]:hover` background can be seen and edited.
export const contextExamples: Record<string, Record<string, ComponentType>> = {
	item: { a: ItemLinkExample },
};
