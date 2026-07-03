"use client";

import { AlertDialog as ADP } from "radix-ui";
import { useState } from "react";
import {
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";

// Content classNames copied from the vendored primitive (src/components/ui/alert-dialog.tsx) so the
// force-mounted raw Overlay/Content carry the seed look for their slot.
const ALERT_DIALOG_OVERLAY = "fixed inset-0 z-50 bg-black/50";
const ALERT_DIALOG_CONTENT =
	"group/alert-dialog-content fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[size=default]:sm:max-w-lg";

export function AlertDialogOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<ADP.Root open>
			<ADP.Trigger asChild>
				<Button variant="outline">Show dialog</Button>
			</ADP.Trigger>
			<div ref={setHost} />
			{host && (
				<ADP.Portal container={host}>
					<ADP.Overlay data-slot="alert-dialog-overlay" className={ALERT_DIALOG_OVERLAY} />
					<ADP.Content
						forceMount
						data-slot="alert-dialog-content"
						data-size="default"
						className={ALERT_DIALOG_CONTENT}
						onEscapeKeyDown={(e) => e.preventDefault()}
					>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete file?</AlertDialogTitle>
							<AlertDialogDescription>This permanently removes the file.</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction>Delete</AlertDialogAction>
						</AlertDialogFooter>
					</ADP.Content>
				</ADP.Portal>
			)}
		</ADP.Root>
	);
}
