import { Icon } from "@registry-ui/icon";

import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "~/components/ui/item";

export function ItemLink() {
	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<Item variant="outline" size="sm" asChild>
				<a href="#">
					<ItemMedia>
						<Icon icon="mdi:check-decagram" className="size-5" />
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
