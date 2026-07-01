import { Icon } from "@registry-ui/icon";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemFooter,
	ItemGroup,
	ItemHeader,
	ItemMedia,
	ItemSeparator,
	ItemTitle,
} from "~/components/ui/item";

// Covers the slots the single Item demo doesn't: item-group, item-separator, item-header, item-footer
// (plus item, item-media, item-content, item-title, item-description).
export function ItemGroupExample() {
	return (
		<ItemGroup className="max-w-sm">
			<Item variant="outline">
				<ItemHeader>Featured</ItemHeader>
				<ItemContent>
					<ItemTitle>Getting started</ItemTitle>
					<ItemDescription>A short guide to the basics.</ItemDescription>
				</ItemContent>
				<ItemFooter>3 min read</ItemFooter>
			</Item>
			<ItemSeparator />
			<Item variant="outline">
				<ItemMedia variant="icon">
					<Icon icon="mdi:book-outline" />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>Reference</ItemTitle>
					<ItemDescription>Full API documentation.</ItemDescription>
				</ItemContent>
			</Item>
		</ItemGroup>
	);
}
