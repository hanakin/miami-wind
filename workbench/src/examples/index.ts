import type { ComponentType } from "react";
import { ItemDemo } from "./item/item-demo";
import { ItemGroupExample } from "./item/item-group";

export type ExampleEntry = { name: string; label: string; Component: ComponentType };

// Hand-authored, static. Consolidated to the fewest examples that still exercise every Item
// data-slot (see components/ui/item.tsx): item, item-group, item-separator, item-media,
// item-content, item-title, item-description, item-actions, item-header, item-footer.
export const examples: Record<string, ExampleEntry[]> = {
	item: [
		{ name: "item-demo", label: "Item", Component: ItemDemo },
		{ name: "item-group", label: "Group", Component: ItemGroupExample },
	],
};
