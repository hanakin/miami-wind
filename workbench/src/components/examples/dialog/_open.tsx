"use client";

import { Dialog as DialogP } from "radix-ui";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";

// Content classNames copied from the vendored primitive (src/components/ui/dialog.tsx) so the
// force-mounted raw Overlay/Content carry the seed look for their slot.
const DIALOG_OVERLAY = "fixed inset-0 z-50 bg-black/50";
const DIALOG_CONTENT =
	"fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none sm:max-w-lg";

export function DialogOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<DialogP.Root open modal={false}>
			<DialogP.Trigger asChild>
				<Button variant="outline">Open dialog</Button>
			</DialogP.Trigger>
			<div ref={setHost} />
			{host && (
				<DialogP.Portal container={host}>
					<DialogP.Overlay data-slot="dialog-overlay" className={DIALOG_OVERLAY} />
					<DialogP.Content
						forceMount
						data-slot="dialog-content"
						className={DIALOG_CONTENT}
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onInteractOutside={(e) => e.preventDefault()}
					>
						<DialogClose className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none" />
						<DialogHeader>
							<DialogTitle>Are you sure?</DialogTitle>
							<DialogDescription>This action cannot be undone.</DialogDescription>
						</DialogHeader>
						<p className="text-sm text-muted-foreground">
							Deleting this item is permanent and cannot be recovered.
						</p>
						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">Cancel</Button>
							</DialogClose>
							<Button>Continue</Button>
						</DialogFooter>
					</DialogP.Content>
				</DialogP.Portal>
			)}
		</DialogP.Root>
	);
}
