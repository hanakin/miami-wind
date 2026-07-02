import { Icon } from "@registry-ui/icon";
import { Button } from "~/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "~/components/ui/item";

// shadcn's item-icon demo (lucide ShieldAlert → our Icon). The icon is deliberately size-less, so the
// `icon` media variant's `[&_svg:not([class*='size-'])]:size-4` sizes it — which is exactly what the
// icon-size context edits live. Shown for the media cva's `variant · icon` and `icon size` targets.
export function ItemMediaIconExample() {
	return (
		<Item variant="outline" className="max-w-lg">
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
	);
}

// shadcn's item-image demo (next/image → plain <img>). Each item's `image` media variant frames the
// cover via `[&_img]:size-full [&_img]:object-cover` — what the image-size context edits. Shown for the
// media cva's `variant · image` and `image size` targets.
const music = [
	{
		title: "Midnight City Lights",
		artist: "Neon Dreams",
		album: "Electric Nights",
		duration: "3:45",
	},
	{
		title: "Coffee Shop Conversations",
		artist: "The Morning Brew",
		album: "Urban Stories",
		duration: "4:05",
	},
	{ title: "Digital Rain", artist: "Cyber Symphony", album: "Binary Beats", duration: "3:30" },
];

export function ItemMediaImageExample() {
	return (
		<ItemGroup className="max-w-md gap-4">
			{music.map((song) => (
				<Item key={song.title} variant="outline" asChild role="listitem">
					<a href="#">
						<ItemMedia variant="image">
							<img
								src={`https://avatar.vercel.sh/${song.title}`}
								alt={song.title}
								width={32}
								height={32}
								className="object-cover grayscale"
							/>
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="line-clamp-1">
								{song.title} - <span className="text-muted-foreground">{song.album}</span>
							</ItemTitle>
							<ItemDescription>{song.artist}</ItemDescription>
						</ItemContent>
						<ItemContent className="flex-none text-center">
							<ItemDescription>{song.duration}</ItemDescription>
						</ItemContent>
					</a>
				</Item>
			))}
		</ItemGroup>
	);
}
