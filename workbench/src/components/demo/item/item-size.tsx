import { Icon } from "@registry-ui/icon";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "~/components/ui/item";

// shadcn's item-size demo, verbatim (InboxIcon → our Icon). Covers the size options: default | sm | xs.
export function ItemSizeDemo() {
	return (
		<Item variant="outline" size="xs">
			<ItemMedia variant="icon">
				<Icon icon="mdi:inbox" />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>Extra Small Size</ItemTitle>
				<ItemDescription>The most compact size available.</ItemDescription>
			</ItemContent>
		</Item>
	);
}
