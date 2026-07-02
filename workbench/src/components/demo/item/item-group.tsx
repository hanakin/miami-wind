import { Icon } from "@registry-ui/icon";
import { Fragment } from "react";
import { Button } from "~/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemSeparator,
	ItemTitle,
} from "~/components/ui/item";

const people = [
	{ username: "shadcn", avatar: "https://github.com/shadcn.png", email: "shadcn@vercel.com" },
	{
		username: "maxleiter",
		avatar: "https://github.com/maxleiter.png",
		email: "maxleiter@vercel.com",
	},
	{
		username: "evilrabbit",
		avatar: "https://github.com/evilrabbit.png",
		email: "evilrabbit@vercel.com",
	},
];

// shadcn's item-group people list, as a separated list (ItemGroup + ItemSeparator). Covers: item-group,
// item-separator, item-media, item-content, item-title, item-description, item-actions.
export function ItemGroupExample() {
	return (
		<ItemGroup className="max-w-sm">
			{people.map((person, i) => (
				<Fragment key={person.username}>
					{i > 0 && <ItemSeparator />}
					<Item>
						<ItemMedia variant="image">
							<img src={person.avatar} alt={person.username} className="grayscale" />
						</ItemMedia>
						<ItemContent className="gap-1">
							<ItemTitle>{person.username}</ItemTitle>
							<ItemDescription>{person.email}</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Button variant="ghost" size="icon" className="rounded-full">
								<Icon icon="mdi:plus" />
							</Button>
						</ItemActions>
					</Item>
				</Fragment>
			))}
		</ItemGroup>
	);
}
