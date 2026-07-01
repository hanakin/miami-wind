import { Icon } from "@registry-ui/icon";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "~/components/ui/item";

// ponytail: our Item cva ships default + sm only; shadcn's `xs` size row is omitted
// until the Item primitive gains that size.
export function ItemSizeDemo() {
	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<Item variant="outline">
				<ItemMedia variant="icon">
					<Icon icon="mdi:inbox-outline" />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>Default Size</ItemTitle>
					<ItemDescription>The standard size for most use cases.</ItemDescription>
				</ItemContent>
			</Item>
			<Item variant="outline" size="sm">
				<ItemMedia variant="icon">
					<Icon icon="mdi:inbox-outline" />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>Small Size</ItemTitle>
					<ItemDescription>A compact size for dense layouts.</ItemDescription>
				</ItemContent>
			</Item>
		</div>
	);
}
