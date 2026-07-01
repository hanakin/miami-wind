import type { ComponentType } from "react";
import { ItemAvatar } from "./item/item-avatar";
import { ItemDemo } from "./item/item-demo";
import { ItemDropdown } from "./item/item-dropdown";
import { ItemGroupExample } from "./item/item-group";
import { ItemHeaderDemo } from "./item/item-header";
import { ItemIcon } from "./item/item-icon";
import { ItemImage } from "./item/item-image";
import { ItemLink } from "./item/item-link";
import { ItemRtl } from "./item/item-rtl";
import { ItemSizeDemo } from "./item/item-size";
import { ItemVariant } from "./item/item-variant";

export type ExampleEntry = { name: string; label: string; Component: ComponentType };

// Hand-authored, static — mirrors shadcn's radix example set 1:1 (their file names + order), but
// rendered with our installed components and our Icon. No glob, no codegen: add a component by
// dropping its `<name>/<name>-<case>.tsx` files here and listing them below.
export const examples: Record<string, ExampleEntry[]> = {
	item: [
		{ name: "item-demo", label: "Demo", Component: ItemDemo },
		{ name: "item-variant", label: "Variant", Component: ItemVariant },
		{ name: "item-size", label: "Size", Component: ItemSizeDemo },
		{ name: "item-icon", label: "Icon", Component: ItemIcon },
		{ name: "item-avatar", label: "Avatar", Component: ItemAvatar },
		{ name: "item-image", label: "Image", Component: ItemImage },
		{ name: "item-group", label: "Group", Component: ItemGroupExample },
		{ name: "item-header", label: "Header", Component: ItemHeaderDemo },
		{ name: "item-link", label: "Link", Component: ItemLink },
		{ name: "item-dropdown", label: "Dropdown", Component: ItemDropdown },
		{ name: "item-rtl", label: "RTL", Component: ItemRtl },
	],
};
