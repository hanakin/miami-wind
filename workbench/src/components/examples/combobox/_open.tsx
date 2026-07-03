"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { useState } from "react";
import {
	Combobox,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxItem,
	ComboboxLabel,
	ComboboxList,
	ComboboxSeparator,
} from "~/components/ui/combobox";

// Content classNames copied from the vendored primitive (src/components/ui/combobox.tsx) so the
// force-mounted raw Popup carries the seed look for its slot.
const COMBOBOX_CONTENT =
	"group/combobox-content relative max-h-96 w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none";

const items = ["Apple", "Banana", "Cherry", "Mango"];

export function ComboboxOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<div ref={setHost} className="w-56">
			{host && (
				<Combobox items={items} defaultOpen>
					<ComboboxPrimitive.Input
						data-slot="combobox-input"
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
						placeholder="Pick a fruit…"
					/>
					<ComboboxPrimitive.Portal container={host} keepMounted>
						<ComboboxPrimitive.Positioner className="isolate z-50">
							<ComboboxPrimitive.Popup data-slot="combobox-content" className={COMBOBOX_CONTENT}>
								<ComboboxList>
									<ComboboxGroup>
										<ComboboxLabel>Fruits</ComboboxLabel>
										<ComboboxItem value="Apple">Apple</ComboboxItem>
										<ComboboxItem value="Banana">Banana</ComboboxItem>
									</ComboboxGroup>
									<ComboboxSeparator />
									<ComboboxGroup>
										<ComboboxLabel>Tropical</ComboboxLabel>
										<ComboboxItem value="Cherry">Cherry</ComboboxItem>
										<ComboboxItem value="Mango">Mango</ComboboxItem>
									</ComboboxGroup>
									<ComboboxEmpty>No results found.</ComboboxEmpty>
								</ComboboxList>
							</ComboboxPrimitive.Popup>
						</ComboboxPrimitive.Positioner>
					</ComboboxPrimitive.Portal>
				</Combobox>
			)}
		</div>
	);
}
