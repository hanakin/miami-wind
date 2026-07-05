"use client";

import { Tooltip as TooltipP } from "@base-ui/react/tooltip";
import { useState } from "react";
import { Button } from "~/components/ui/button";

// Popup className copied from the vendored primitive (src/components/ui/tooltip.tsx) — the seed look
// for the tooltip-content slot. Animation classes omitted because keepMounted keeps the content
// statically mounted.
const TOOLTIP_CONTENT =
	"z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background";

export function TooltipOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<TooltipP.Provider>
			<TooltipP.Root open>
				<TooltipP.Trigger
					render={
						<Button variant="outline" data-slot="tooltip-trigger">
							Hover me
						</Button>
					}
				/>
				<div ref={setHost} />
				{host && (
					<TooltipP.Portal container={host} keepMounted>
						<TooltipP.Positioner className="isolate z-50" sideOffset={4}>
							<TooltipP.Popup data-slot="tooltip-content" className={TOOLTIP_CONTENT}>
								Add to library
							</TooltipP.Popup>
						</TooltipP.Positioner>
					</TooltipP.Portal>
				)}
			</TooltipP.Root>
		</TooltipP.Provider>
	);
}
