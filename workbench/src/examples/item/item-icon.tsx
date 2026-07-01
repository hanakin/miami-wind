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

export function ItemIcon() {
	return (
		<div className="flex w-full max-w-lg flex-col gap-6">
			<Item variant="outline">
				<ItemMedia variant="icon">
					<Icon icon="mdi:shield-alert-outline" />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>Security Alert</ItemTitle>
					<ItemDescription>New login detected from unknown device.</ItemDescription>
				</ItemContent>
				<ItemActions>
					<Button size="sm" variant="outline">
						Review
					</Button>
				</ItemActions>
			</Item>
		</div>
	);
}
