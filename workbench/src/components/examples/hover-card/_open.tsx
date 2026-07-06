"use client";

import { PreviewCard as HCP } from "@base-ui/react/preview-card";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { HoverCard, HoverCardTrigger } from "~/components/ui/hover-card";

// Popup className copied from the vendored primitive (src/components/ui/hover-card.tsx) so the
// keep-mounted raw Positioner/Popup carries the seed look for its slot.
const HOVER_CARD_CONTENT =
	"z-50 w-64 origin-(--transform-origin) rounded-lg bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden";

export function HoverCardOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<HoverCard open>
			<HoverCardTrigger
				render={
					<Button variant="link" data-slot="hover-card-trigger">
						@miami-wind
					</Button>
				}
			/>
			<div ref={setHost} />
			{host && (
				<HCP.Portal container={host} keepMounted>
					<HCP.Positioner className="isolate z-50" sideOffset={4}>
						<HCP.Popup data-slot="hover-card-content" className={HOVER_CARD_CONTENT}>
							<div className="font-semibold">@miami-wind</div>
							<div>A dark-only shadcn registry.</div>
						</HCP.Popup>
					</HCP.Positioner>
				</HCP.Portal>
			)}
		</HoverCard>
	);
}
