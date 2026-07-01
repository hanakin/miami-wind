import { Icon } from "@registry-ui/icon";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "~/components/ui/item";

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

export function ItemDropdown() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">
					Select <Icon icon="mdi:chevron-down" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-48" align="end">
				<DropdownMenuGroup>
					{people.map((person) => (
						<DropdownMenuItem key={person.username}>
							{/* ponytail: our Item cva has no `xs` size; `sm` + p-2 override matches the compact look. */}
							<Item size="sm" className="w-full p-2">
								<ItemMedia>
									<Avatar className="size-[1.625rem]">
										<AvatarImage src={person.avatar} className="grayscale" />
										<AvatarFallback>{person.username.charAt(0)}</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent className="gap-0">
									<ItemTitle>{person.username}</ItemTitle>
									<ItemDescription className="leading-none">{person.email}</ItemDescription>
								</ItemContent>
							</Item>
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
