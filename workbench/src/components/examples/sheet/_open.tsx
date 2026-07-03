"use client";

import { Dialog as SheetP } from "radix-ui";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	SheetClose,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";

// Content classNames copied from the vendored primitive (src/components/ui/sheet.tsx) so the
// force-mounted raw Overlay/Content carry the seed look for their slot.
const SHEET_OVERLAY = "fixed inset-0 z-50 bg-black/50";
const SHEET_CONTENT =
	"fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-in-out inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm";

export function SheetOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<SheetP.Root open modal={false}>
			<SheetP.Trigger asChild>
				<Button variant="outline">Open sheet</Button>
			</SheetP.Trigger>
			<div ref={setHost} />
			{host && (
				<SheetP.Portal container={host}>
					<SheetP.Overlay data-slot="sheet-overlay" className={SHEET_OVERLAY} />
					<SheetP.Content
						forceMount
						data-slot="sheet-content"
						className={SHEET_CONTENT}
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onInteractOutside={(e) => e.preventDefault()}
					>
						<SheetHeader>
							<SheetTitle>Edit profile</SheetTitle>
							<SheetDescription>
								Make changes to your profile here. Click save when you&apos;re done.
							</SheetDescription>
						</SheetHeader>
						<div className="flex-1 px-4" />
						<SheetFooter>
							<Button type="submit">Save changes</Button>
							<SheetClose asChild>
								<Button variant="outline">Close</Button>
							</SheetClose>
						</SheetFooter>
					</SheetP.Content>
				</SheetP.Portal>
			)}
		</SheetP.Root>
	);
}
