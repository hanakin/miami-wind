import { Icon } from "@registry-ui/icon";

import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "~/components/ui/item";

// The item as a link (asChild <a>) — also the small-size example (size=sm), with a description so the
// compact size reads clearly, and an icon-variant media so the icon-size context resolves here.
export function ItemLink() {
	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<Item variant="outline" size="sm" asChild>
				<a href="#">
					<ItemMedia variant="icon">
						<Icon icon="mdi:check-decagram" />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>Your profile has been verified.</ItemTitle>
						<ItemDescription>View your verification details.</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Icon icon="mdi:chevron-right" className="size-4" />
					</ItemActions>
				</a>
			</Item>
		</div>
	);
}
