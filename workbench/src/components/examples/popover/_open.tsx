"use client";

import { Popover as PopoverP } from "radix-ui";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "~/components/ui/popover";

// Content className copied from the vendored primitive (src/components/ui/popover.tsx) so the
// force-mounted raw Content carries the seed look for its slot.
const POPOVER_CONTENT =
	"z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden";

export function PopoverOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<PopoverP.Root open>
			<PopoverTrigger asChild>
				<Button variant="outline">Open popover</Button>
			</PopoverTrigger>
			<div ref={setHost} />
			{host && (
				<PopoverP.Portal container={host}>
					<PopoverP.Content
						forceMount
						data-slot="popover-content"
						className={POPOVER_CONTENT}
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onPointerDownOutside={(e) => e.preventDefault()}
					>
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
					</PopoverP.Content>
				</PopoverP.Portal>
			)}
		</PopoverP.Root>
	);
}
