import { Icon } from "@registry-ui/icon";
import { Button } from "~/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "~/components/ui/item";

// Covers slots: item, item-media, item-content, item-title, item-description, item-actions.
export function ItemDemo() {
	return (
		<Item variant="outline" className="max-w-sm">
			<ItemMedia variant="icon">
				<Icon icon="mdi:folder-outline" />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>Project files</ItemTitle>
				<ItemDescription>128 documents · updated 2h ago</ItemDescription>
			</ItemContent>
			<ItemActions>
				<Button variant="outline" size="sm">
					Open
				</Button>
			</ItemActions>
		</Item>
	);
}
