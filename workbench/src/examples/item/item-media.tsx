import { Icon } from "@registry-ui/icon";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "~/components/ui/item";

// Item whose media is the `icon` variant of itemMediaVariants — a bordered square that sizes any bare
// child <svg> to size-4 (`[&_svg:not([class*='size-'])]:size-4`). The Icon carries NO size class, so
// that rule applies and the icon becomes live-resizable via the media cva. Shown when the media cva's
// `variant · icon` (or its `icon size` context) is selected, so the variant is visible in context.
export function ItemMediaIconExample() {
	return (
		<Item variant="outline" className="max-w-md">
			<ItemMedia variant="icon">
				<Icon icon="mdi:cloud-outline" />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>Cloud sync</ItemTitle>
				<ItemDescription>Your files are backed up.</ItemDescription>
			</ItemContent>
		</Item>
	);
}

// Item whose media is the `image` variant — a size-10 rounded box whose child <img> fills it
// (`[&_img]:size-full [&_img]:object-cover`). Shown for the media cva's `variant · image` / image size.
export function ItemMediaImageExample() {
	return (
		<Item variant="outline" className="max-w-md">
			<ItemMedia variant="image">
				<img src="https://github.com/shadcn.png" alt="" />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>shadcn</ItemTitle>
				<ItemDescription>Creator of shadcn/ui.</ItemDescription>
			</ItemContent>
		</Item>
	);
}
