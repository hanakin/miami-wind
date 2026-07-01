import { Icon } from "@registry-ui/icon";
import type { ComponentProps } from "react";
import { Button } from "~/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "~/components/ui/item";

// The canonical single Item — the "main example" the editor re-renders with a variant applied when
// you filter to one. Defaults: the demo's width (not full-bleed) and the outline variant, so a
// filtered *size* variant (which sets no `variant`) still shows a bordered box — padding is invisible
// on the transparent `default`. A selected variant option overrides `variant`. Variant props arrive
// from the live cva model as plain strings; Item's typed unions reject them, so cast at this boundary.
export function ItemPrimary(props: Record<string, string>) {
	return (
		<Item variant="outline" className="max-w-md" {...(props as ComponentProps<typeof Item>)}>
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
	);
}

// shadcn's item-demo, verbatim (icons → our Icon). Covers: item, item-content, item-title,
// item-description, item-actions, item-media.
export function ItemDemo() {
	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<ItemPrimary variant="outline" />
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
