"use client";

import { Dialog as DialogP } from "@base-ui/react/dialog";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";

// classNames copied from the vendored primitive (src/components/ui/dialog.tsx) so the
// keep-mounted raw Backdrop/Popup carry the seed look for their slot.
const DIALOG_OVERLAY =
	"absolute inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs";
const DIALOG_CONTENT =
	"absolute top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-md";

export function DialogOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<DialogP.Root open modal={false}>
			<DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
			<div ref={setHost} className="relative min-h-[220px] w-full" />
			{host && (
				<DialogP.Portal container={host} keepMounted>
					<DialogP.Backdrop data-slot="dialog-overlay" className={DIALOG_OVERLAY} />
					<DialogP.Popup data-slot="dialog-content" className={DIALOG_CONTENT}>
						<DialogHeader>
							<DialogTitle>Are you sure?</DialogTitle>
							<DialogDescription>This action cannot be undone.</DialogDescription>
						</DialogHeader>
						<p className="text-sm text-muted-foreground">
							Deleting this item is permanent and cannot be recovered.
						</p>
						<DialogFooter>
							<DialogClose render={<Button variant="outline">Cancel</Button>} />
							<Button>Continue</Button>
						</DialogFooter>
					</DialogP.Popup>
				</DialogP.Portal>
			)}
		</DialogP.Root>
	);
}
