import { Icon } from "@registry-ui/icon";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "~/components/ui/item";

// The item as a link — `asChild` turns the whole Item into an <a>, which activates its `[a]:` styles
// (transition + hover background). Shown when the `[a]` context is selected so the context is visible
// and its hover becomes live-editable.
export function ItemLinkExample() {
	return (
		<Item asChild variant="outline" className="max-w-md">
			<a href="#">
				<ItemMedia>
					<Icon icon="mdi:account-check-outline" className="size-5" />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>Your profile has been verified.</ItemTitle>
					<ItemDescription>Hover me — the whole row is a link.</ItemDescription>
				</ItemContent>
				<ItemActions>
					<Icon icon="mdi:chevron-right" className="size-4" />
				</ItemActions>
			</a>
		</Item>
	);
}
