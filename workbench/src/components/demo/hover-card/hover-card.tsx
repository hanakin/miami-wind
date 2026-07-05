"use client";

import { Button } from "~/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card";

export function HoverCardDemo() {
	return (
		<HoverCard>
			<HoverCardTrigger render={<Button variant="link">Hover Here</Button>} />
			<HoverCardContent className="flex w-64 flex-col gap-0.5">
				<div className="font-semibold">@nextjs</div>
				<div>The React Framework – created and maintained by @vercel.</div>
				<div className="mt-1 text-xs text-muted-foreground">Joined December 2021</div>
			</HoverCardContent>
		</HoverCard>
	);
}
