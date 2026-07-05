"use client";

import { Dialog as SheetP } from "@base-ui/react/dialog";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	SheetClose,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";

// classNames copied from the vendored primitive (src/components/ui/sheet.tsx) so the
// keep-mounted raw Backdrop/Popup carry the seed look for their slot.
const SHEET_OVERLAY = "absolute inset-0 isolate z-50 bg-black/10";
const SHEET_CONTENT =
	"absolute inset-y-0 right-0 z-50 flex h-full w-3/4 flex-col gap-4 border-l bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg sm:max-w-sm";

export function SheetOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<SheetP.Root open modal={false}>
			<SheetTrigger render={<Button variant="outline">Open sheet</Button>} />
			<div ref={setHost} className="relative min-h-[260px] w-full overflow-hidden" />
			{host && (
				<SheetP.Portal container={host} keepMounted>
					<SheetP.Backdrop data-slot="sheet-overlay" className={SHEET_OVERLAY} />
					<SheetP.Popup data-slot="sheet-content" className={SHEET_CONTENT}>
						<SheetHeader>
							<SheetTitle>Edit profile</SheetTitle>
							<SheetDescription>
								Make changes to your profile here. Click save when you&apos;re done.
							</SheetDescription>
						</SheetHeader>
						<div className="flex-1 px-4" />
						<SheetFooter>
							<Button type="submit">Save changes</Button>
							<SheetClose render={<Button variant="outline">Close</Button>} />
						</SheetFooter>
					</SheetP.Popup>
				</SheetP.Portal>
			)}
		</SheetP.Root>
	);
}
