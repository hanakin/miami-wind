"use client";

import { Popover as PopoverP } from "@base-ui/react/popover";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Popover,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "~/components/ui/popover";

// Popup className copied from the vendored primitive (src/components/ui/popover.tsx) so the
// keep-mounted raw Positioner/Popup carries the seed look for its slot.
const POPOVER_CONTENT =
	"z-50 flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-md bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden";

export function PopoverOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<Popover open>
			<PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
			<div ref={setHost} />
			{host && (
				<PopoverP.Portal container={host} keepMounted>
					<PopoverP.Positioner className="isolate z-50" sideOffset={4}>
						<PopoverP.Popup data-slot="popover-content" className={POPOVER_CONTENT}>
							<PopoverHeader>
								<PopoverTitle>Dimensions</PopoverTitle>
								<PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
							</PopoverHeader>
							<div className="grid gap-2 pt-2">
								<div className="grid grid-cols-3 items-center gap-4">
									<Label htmlFor="pop-width">Width</Label>
									<Input id="pop-width" defaultValue="100%" className="col-span-2 h-8" />
								</div>
								<div className="grid grid-cols-3 items-center gap-4">
									<Label htmlFor="pop-max-width">Max. width</Label>
									<Input id="pop-max-width" defaultValue="300px" className="col-span-2 h-8" />
								</div>
								<div className="grid grid-cols-3 items-center gap-4">
									<Label htmlFor="pop-height">Height</Label>
									<Input id="pop-height" defaultValue="25px" className="col-span-2 h-8" />
								</div>
								<div className="grid grid-cols-3 items-center gap-4">
									<Label htmlFor="pop-max-height">Max. height</Label>
									<Input id="pop-max-height" defaultValue="none" className="col-span-2 h-8" />
								</div>
							</div>
						</PopoverP.Popup>
					</PopoverP.Positioner>
				</PopoverP.Portal>
			)}
		</Popover>
	);
}
