import { Icon } from "@registry-ui/icon";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "~/components/ui/item";

// shadcn's item-size demo (InboxIcon → our Icon), reduced to the sizes the main item demo doesn't show:
// small + extra small. default is covered by item-demo; these give size·sm / size·xs a real item.
export function ItemSizeDemo() {
	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<Item variant="outline" size="sm">
				<ItemMedia variant="icon">
					<Icon icon="mdi:inbox" />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>Small Size</ItemTitle>
					<ItemDescription>A compact size for dense layouts.</ItemDescription>
				</ItemContent>
			</Item>
			<Item variant="outline" size="xs">
				<ItemMedia variant="icon">
					<Icon icon="mdi:inbox" />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>Extra Small Size</ItemTitle>
					<ItemDescription>The most compact size available.</ItemDescription>
				</ItemContent>
			</Item>
		</div>
	);
}
