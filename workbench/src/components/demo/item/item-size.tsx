import { Icon } from "@registry-ui/icon";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "~/components/ui/item";

// The extra-small size — a single, self-contained item. default size is the canonical item.tsx, small is
// item-link; xs is the one size no other demo carries, so it gets this minimal single-item demo.
export function ItemSizeDemo() {
	return (
		<div className="flex w-full max-w-md flex-col gap-6">
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
