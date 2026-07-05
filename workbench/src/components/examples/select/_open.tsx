"use client";

import { Select as SelectP } from "@base-ui/react/select";
import { useState } from "react";
import { SelectItem, SelectLabel, SelectSeparator } from "~/components/ui/select";

// Popup className copied from the vendored primitive (src/components/ui/select.tsx) so the
// keep-mounted raw Positioner/Popup carries the seed look for its slot.
const SELECT_CONTENT =
	"relative isolate z-50 max-h-(--available-height) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none";

export function SelectOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<SelectP.Root open value="a">
			<SelectP.Trigger
				data-slot="select-trigger"
				className="flex w-44 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none"
			>
				<SelectP.Value placeholder="Pick one" />
			</SelectP.Trigger>
			<div ref={setHost} />
			{host && (
				<SelectP.Portal container={host}>
					<SelectP.Positioner className="isolate z-50" sideOffset={4}>
						<SelectP.Popup data-slot="select-content" className={SELECT_CONTENT}>
							<SelectP.List>
								<SelectP.Group data-slot="select-group">
									<SelectLabel>Fruits</SelectLabel>
									<SelectItem value="a">Apple</SelectItem>
									<SelectItem value="b">Banana</SelectItem>
									<SelectSeparator />
									<SelectItem value="c">Cherry</SelectItem>
								</SelectP.Group>
							</SelectP.List>
						</SelectP.Popup>
					</SelectP.Positioner>
				</SelectP.Portal>
			)}
		</SelectP.Root>
	);
}
