"use client";

import { HoverCard as HCP } from "radix-ui";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { HoverCard, HoverCardTrigger } from "~/components/ui/hover-card";

// Content className copied from the vendored primitive (src/components/ui/hover-card.tsx) so the
// force-mounted raw Content carries the seed look for its slot.
const HOVER_CARD_CONTENT =
	"z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden";

export function HoverCardOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<HoverCard open>
			<HoverCardTrigger asChild>
				<Button variant="link" data-slot="hover-card-trigger">
					@miami-wind
				</Button>
			</HoverCardTrigger>
			<div ref={setHost} />
			{host && (
				<HCP.Portal container={host}>
					<HCP.Content
						forceMount
						data-slot="hover-card-content"
						className={HOVER_CARD_CONTENT}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onPointerDownOutside={(e) => e.preventDefault()}
					>
						<div className="font-semibold">@miami-wind</div>
						<div>A dark-only shadcn registry.</div>
					</HCP.Content>
				</HCP.Portal>
			)}
		</HoverCard>
	);
}
