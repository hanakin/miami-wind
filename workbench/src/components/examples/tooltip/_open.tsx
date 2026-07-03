"use client";

import { Tooltip as TooltipP } from "radix-ui";
import { useState } from "react";
import { Button } from "~/components/ui/button";

// className copied from the vendored primitive (src/components/ui/tooltip.tsx) — the seed look for
// the tooltip-content slot. animate-in / zoom-in-95 classes omitted because forceMount keeps the
// content statically mounted and the open-render style resets positioning anyway.
const TOOLTIP_CONTENT =
	"z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background";

export function TooltipOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<TooltipP.Provider>
			<TooltipP.Root open>
				<TooltipP.Trigger asChild>
					<Button variant="outline" data-slot="tooltip-trigger">
						Hover me
					</Button>
				</TooltipP.Trigger>
				<div ref={setHost} />
				{host && (
					<TooltipP.Portal container={host}>
						<TooltipP.Content
							forceMount
							data-slot="tooltip-content"
							className={TOOLTIP_CONTENT}
							onEscapeKeyDown={(e) => e.preventDefault()}
							onPointerDownOutside={(e) => e.preventDefault()}
						>
							Add to library
						</TooltipP.Content>
					</TooltipP.Portal>
				)}
			</TooltipP.Root>
		</TooltipP.Provider>
	);
}
