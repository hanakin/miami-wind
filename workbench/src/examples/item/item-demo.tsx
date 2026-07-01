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

// shadcn's item-demo, verbatim (icons → our Icon). Covers: item, item-content, item-title,
// item-description, item-actions, item-media.
export function ItemDemo() {
	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<Item variant="outline">
				<ItemContent>
					<ItemTitle>Basic Item</ItemTitle>
					<ItemDescription>A simple item with title and description.</ItemDescription>
				</ItemContent>
				<ItemActions>
					<Button variant="outline" size="sm">
						Action
					</Button>
				</ItemActions>
			</Item>
			<Item variant="outline" size="sm" asChild>
				<a href="#">
					<ItemMedia>
						<Icon icon="mdi:check-decagram-outline" className="size-5" />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>Your profile has been verified.</ItemTitle>
					</ItemContent>
					<ItemActions>
						<Icon icon="mdi:chevron-right" className="size-4" />
					</ItemActions>
				</a>
			</Item>
		</div>
	);
}
