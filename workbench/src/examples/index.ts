import type { ComponentType } from "react";
import { ItemDemo, ItemPrimary } from "./item/item-demo";
import { ItemGroupExample } from "./item/item-group";
import { ItemHeaderDemo } from "./item/item-header";

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
};

// The canonical single instance per component, re-rendered with the selected variant applied so
// filtering to a variant shows that variant — stock, one we modify, or a new one added in "Manage
// variants". A static example can't cover a variant that doesn't exist yet; this can.
export const primaryExamples: Record<string, ComponentType<Record<string, string>>> = {
	item: ItemPrimary,
};
