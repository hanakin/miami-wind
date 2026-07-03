"use client";

import { Select as SelectP } from "radix-ui";
import { useState } from "react";
import { SelectItem, SelectLabel, SelectSeparator } from "~/components/ui/select";

// Content className copied from the vendored primitive (src/components/ui/select.tsx) so the
// force-mounted raw Content carries the seed look for its slot.
const SELECT_CONTENT =
	"relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md";

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
					<SelectP.Content
						forceMount
						position="item-aligned"
						data-slot="select-content"
						className={SELECT_CONTENT}
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onPointerDownOutside={(e) => e.preventDefault()}
					>
						<SelectP.Viewport className="p-1">
							<SelectP.Group data-slot="select-group">
								<SelectLabel>Fruits</SelectLabel>
								<SelectItem value="a">Apple</SelectItem>
								<SelectItem value="b">Banana</SelectItem>
								<SelectSeparator />
								<SelectItem value="c">Cherry</SelectItem>
							</SelectP.Group>
						</SelectP.Viewport>
					</SelectP.Content>
				</SelectP.Portal>
			)}
		</SelectP.Root>
	);
}
