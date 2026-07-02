import type { ComponentType } from "react";
import { ItemDemo, ItemPrimary } from "./item/item-demo";
import { ItemGroupExample } from "./item/item-group";
import { ItemHeaderDemo } from "./item/item-header";
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
// since a component can have several). The filter view PULLS FROM the finalized `examples` above — never
// new authored content: the root primary can't show a media-cva variant (it has no <ItemMedia>), so each
// media variant reuses the example that already exercises it. icon → ItemDemo (its badge icon in media);
// image / default → ItemGroupExample (its avatars in media). item's transparent root `default` also uses
// the group. Unmapped variants fall back to the root primary (see example-preview).
export const variantExamples: Record<string, Record<string, ComponentType>> = {
	item: {
		"itemVariants:variant:default": ItemGroupExample,
		"itemMediaVariants:variant:default": ItemGroupExample,
		"itemMediaVariants:variant:icon": ItemDemo,
		"itemMediaVariants:variant:image": ItemGroupExample,
	},
};

// Per-component example for a pass-through context (keyed by the context, e.g. `a`, `icon`, `image`).
// Rendered when that context target is selected — again PULLED FROM the finalized `examples`: the `[a]`
// link and the icon media both live in ItemDemo (its asChild <a> row carries a badge icon in media);
// image media lives in ItemGroupExample (avatars).
export const contextExamples: Record<string, Record<string, ComponentType>> = {
	item: { a: ItemDemo, icon: ItemDemo, image: ItemGroupExample },
};
